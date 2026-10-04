import { ComponentCommand, type ComponentContext } from "seyfert";

/**
 * Default string-select menu component handler used as a template for new select menus.
 */
export default class Default extends ComponentCommand {
    componentType = "StringSelect" as const;

    async run(ctx: ComponentContext<typeof this.componentType>) {
        return await ctx.editOrReply({ content: "Hello World from Select Menu" });
    }
}
