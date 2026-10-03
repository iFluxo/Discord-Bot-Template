import { ComponentCommand, type ComponentContext } from "seyfert";

/**
 * Default button component handler used as a template for new buttons.
 */
export default class Default extends ComponentCommand {
    componentType = "Button" as const;

    async run(ctx: ComponentContext<typeof this.componentType>) {
        return ctx.editOrReply({ content: "Hello World from Button" });
    }
}
