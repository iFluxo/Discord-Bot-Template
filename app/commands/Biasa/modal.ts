import {
  Modal,
  Label,
  TextInput,
  TextInputStyle,
  Command,
  Declare,
  IgnoreCommand,
  type ModalSubmitInteraction,
  type CommandContext,
} from 'seyfert';

@Declare({
  name: 'modal',
  description: 'I will send you a hello world message',
  ignore: IgnoreCommand.Message
})
export default class ModalCommand extends Command {
  async run(ctx: CommandContext) {
    const modal = new Modal()
  .setCustomId('feedback-modal')
  .setTitle('Feedback')
  .addComponents(
    new Label()
    .setLabel('Rating')
    .setComponent(new TextInput().setCustomId('rating').setStyle(TextInputStyle.Short)),
  )
      .run(this.handleModal);

    await ctx.modal(modal);
  }

  async handleModal(i: ModalSubmitInteraction) {
    return i.editOrReply({ content: 'Hello World 👋' });
  }
}