import {
    ActionRow,
    Button,
    ButtonStyle,
    Container,
    MessageFlags,
    Separator,
    TextDisplay,
    type CommandContext,
    type WebhookMessageStructure,
} from "seyfert";

export interface PaginationOptions<T> {
    data: T[];
    perPage?: number;
    timeout?: number;
    title?: string;
    userId?: string;

    render: (item: T, index: number) => string;
}

export class Pagination<T> {
    private readonly data: T[];
    private readonly perPage: number;
    private readonly timeout: number;
    private readonly title?: string;
    private readonly userId?: string;
    private readonly render: PaginationOptions<T>["render"];

    private page = 0;
    private active = true;
    private message?: WebhookMessageStructure;

    public constructor(options: PaginationOptions<T>) {
        this.data = options.data;
        this.perPage = Math.max(1, options.perPage ?? 10);
        this.timeout = Math.max(1_000, options.timeout ?? 300_000);
        this.title = options.title;
        this.userId = options.userId;
        this.render = options.render;
    }

    public get currentPage(): number {
        return this.page;
    }

    public get totalPages(): number {
        return Math.max(
            1,
            Math.ceil(this.data.length / this.perPage),
        );
    }

    public get isActive(): boolean {
        return this.active;
    }

    private getItems(): T[] {
        const start = this.page * this.perPage;

        return this.data.slice(
            start,
            start + this.perPage,
        );
    }

    private getContent(): string {
        const items = this.getItems();

        if (!items.length) {
            return "Tidak ada data.";
        }

        return items
            .map((item, index) => {
                const absoluteIndex =
                    this.page * this.perPage + index;

                return this.render(
                    item,
                    absoluteIndex,
                );
            })
            .join("\n");
    }

    private createButton(
        customId: string,
        label: string,
        disabled: boolean,
    ): Button {
        return new Button()
            .setCustomId(customId)
            .setLabel(label)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled);
    }

    private createComponents(disabled = false) {
        const first = this.createButton(
            "first",
            "≪",
            disabled || this.page === 0,
        );

        const previous = this.createButton(
            "previous",
            "‹",
            disabled || this.page === 0,
        );

        const next = this.createButton(
            "next",
            "›",
            disabled || this.page >= this.totalPages - 1,
        );

        const last = this.createButton(
            "last",
            "≫",
            disabled || this.page >= this.totalPages - 1,
        );

        const navigation = new ActionRow<Button>()
            .addComponents(
                first,
                previous,
                next,
                last,
            );

        return [
            new Container().addComponents(
                ...(this.title
                    ? [
                          new TextDisplay()
                              .setContent(
                                  `## ${this.title}`,
                              ),
                          new Separator(),
                      ]
                    : []),

                new TextDisplay()
                    .setContent(
                        this.getContent(),
                    ),

                new Separator(),

                new TextDisplay()
                    .setContent(
                        `Page **${this.page + 1}** / **${this.totalPages}**`,
                    ),

                navigation,
            ),
        ];
    }

    private async update(): Promise<void> {
        if (!this.message || !this.active) {
            return;
        }

        await this.message.edit({
            components: this.createComponents(),
            flags: MessageFlags.IsComponentsV2,
        });
    }

    private async disable(): Promise<void> {
        if (!this.message) {
            return;
        }

        this.active = false;

        await this.message.edit({
            components: this.createComponents(true),
            flags: MessageFlags.IsComponentsV2,
        });
    }

    private async handle(
        customId: string,
        interaction: Parameters<
            NonNullable<
                ReturnType<
                    WebhookMessageStructure[
                        "createComponentCollector"
                    ]["run"]
                >
            >
        >[1]
    ): Promise<void> {
        if (!this.active) {
            return;
        }

        if (
            this.userId &&
            interaction.author.id !== this.userId
        ) {
            await interaction.write({
                content:
                    "Kamu tidak dapat menggunakan pagination ini.",
                ephemeral: true,
            });

            return;
        }

        switch (customId) {
            case "first":
                this.page = 0;
                break;

            case "previous":
                if (this.page > 0) {
                    this.page--;
                }
                break;

            case "next":
                if (this.page < this.totalPages - 1) {
                    this.page++;
                }
                break;

            case "last":
                this.page = this.totalPages - 1;
                break;

            default:
                return;
        }

        await interaction.update({
            components: this.createComponents(),
            flags: MessageFlags.IsComponentsV2,
        });
    }

    public async send(
        ctx: CommandContext,
    ): Promise<WebhookMessageStructure> {
        if (!this.data.length) {
            const message = await ctx.write(
                {
                    components: [
                        new Container().addComponents(
                            new TextDisplay()
                                .setContent(
                                    this.title
                                        ? `## ${this.title}\n\nTidak ada data.`
                                        : "Tidak ada data.",
                                ),
                        ),
                    ],
                    flags: MessageFlags.IsComponentsV2,
                },
                true,
            );

            this.active = false;

            return message;
        }

        const message = await ctx.write(
            {
                components:
                    this.createComponents(),
                flags: MessageFlags.IsComponentsV2,
            },
            true,
        );

        this.message = message;

        const collector =
            message.createComponentCollector({
                timeout: this.timeout,
            });

        collector.run(
            "first",
            async interaction => {
                await this.handle(
                    "first",
                    interaction,
                );
            },
        );

        collector.run(
            "previous",
            async interaction => {
                await this.handle(
                    "previous",
                    interaction,
                );
            },
        );

        collector.run(
            "next",
            async interaction => {
                await this.handle(
                    "next",
                    interaction,
                );
            },
        );

        collector.run(
            "last",
            async interaction => {
                await this.handle(
                    "last",
                    interaction,
                );
            },
        );

        return message;
    }

    public async cleanup(): Promise<void> {
        if (!this.active) {
            return;
        }

        await this.disable();
    }
}