import {
    ActionRow,
    Button,
    Container,
    TextDisplay,
    Separator,
} from "seyfert";

export interface PaginationOptions<T> {
    data: T[];
    perPage?: number;
    render: (item: T, index: number) => string;
    title?: string;
}

export class Pagination<T> {
    private readonly data: T[];
    private readonly perPage: number;
    private readonly render: PaginationOptions<T>["render"];
    private readonly title?: string;

    private page = 0;

    public constructor(options: PaginationOptions<T>) {
        this.data = options.data;
        this.perPage = Math.max(1, options.perPage ?? 10);
        this.render = options.render;
        this.title = options.title;
    }

    public get totalPages(): number {
        return Math.max(1, Math.ceil(this.data.length / this.perPage));
    }

    public get currentPage(): number {
        return this.page;
    }

    private getItems(): T[] {
        const start = this.page * this.perPage;

        return this.data.slice(start, start + this.perPage);
    }

    private getContent(): string {
        const items = this.getItems();

        if (!items.length) {
            return "Tidak ada data.";
        }

        return items
            .map((item, index) => {
                const absoluteIndex = this.page * this.perPage + index;

                return this.render(item, absoluteIndex);
            })
            .join("\n");
    }

    private build() {
        const previous = new Button()
            .setCustomId("pagination:previous")
            .setLabel("Previous")
            .setStyle(2)
            .setDisabled(this.page <= 0);

        const next = new Button()
            .setCustomId("pagination:next")
            .setLabel("Next")
            .setStyle(2)
            .setDisabled(this.page >= this.totalPages - 1);

        const navigation = new ActionRow().addComponents(
            previous,
            next,
        );

        const components = [
            new Container().addComponents(
                ...(this.title
                    ? [new TextDisplay().setContent(`## ${this.title}`), new Separator()]
                    : []),
                new TextDisplay().setContent(this.getContent()),
                new Separator(),
                new TextDisplay().setContent(
                    `Page **${this.page + 1}** / **${this.totalPages}**`,
                ),
                navigation,
            ),
        ];

        return components;
    }

    public next(): boolean {
        if (this.page >= this.totalPages - 1) {
            return false;
        }

        this.page++;
        return true;
    }

    public previous(): boolean {
        if (this.page <= 0) {
            return false;
        }

        this.page--;
        return true;
    }

    public getComponents() {
        return this.build();
    }
}