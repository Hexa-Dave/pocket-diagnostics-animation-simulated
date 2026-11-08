export type CustomerReplyHandler = (reply: string) => void;

export class CustomerConversationPanel {
  public readonly element: HTMLElement;

  private readonly history: HTMLDivElement;
  private readonly choices: HTMLDivElement;
  private readonly form: HTMLFormElement;
  private readonly input: HTMLInputElement;
  private replyHandler: CustomerReplyHandler | undefined;

  public constructor(parent: HTMLElement) {
    this.element = document.createElement('section');
    this.element.className = 'conversation-controls';
    this.element.setAttribute('aria-label', 'Customer conversation');
    this.element.hidden = true;

    const heading = document.createElement('h2');
    heading.textContent = 'CUSTOMER CONVERSATION';

    this.history = document.createElement('div');
    this.history.className = 'conversation-history';
    this.history.setAttribute('aria-live', 'polite');

    this.choices = document.createElement('div');
    this.choices.className = 'conversation-choices';

    this.form = document.createElement('form');
    this.form.className = 'conversation-reply-form';
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.name = 'customer-reply';
    this.input.autocomplete = 'off';
    this.input.setAttribute('aria-label', 'Your response');
    this.input.placeholder = 'Type your response';

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'SEND';
    this.form.append(this.input, submit);
    this.form.hidden = true;
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      const reply = this.input.value.trim();
      if (reply) {
        this.submitReply(reply);
      }
    });

    this.element.append(heading, this.history, this.choices, this.form);
    parent.appendChild(this.element);
  }

  public clear(): void {
    this.replyHandler = undefined;
    this.history.replaceChildren();
    this.choices.replaceChildren();
    this.form.hidden = true;
    this.input.value = '';
    this.element.hidden = true;
  }

  public ask(
    question: string,
    choices: readonly string[] | undefined,
    replyHandler: CustomerReplyHandler
  ): void {
    this.element.hidden = false;
    this.appendMessage('Expert Guidance', question);
    this.replyHandler = replyHandler;
    this.choices.replaceChildren();
    this.form.hidden = choices !== undefined;
    this.input.value = '';

    for (const choice of choices ?? []) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = choice;
      button.addEventListener('click', () => this.submitReply(choice), { once: true });
      this.choices.appendChild(button);
    }

    if (choices === undefined) {
      this.input.focus();
    }
  }

  public note(speaker: string, text: string): void {
    this.element.hidden = false;
    this.appendMessage(speaker, text);
  }

  private submitReply(reply: string): void {
    const handler = this.replyHandler;
    if (!handler) {
      return;
    }

    this.replyHandler = undefined;
    this.choices.replaceChildren();
    this.form.hidden = true;
    this.input.value = '';
    this.appendMessage('Customer', reply);
    handler(reply);
  }

  private appendMessage(speaker: string, text: string): void {
    const message = document.createElement('p');
    const label = document.createElement('strong');
    label.textContent = `${speaker}: `;
    message.append(label, document.createTextNode(text));
    this.history.appendChild(message);
    window.requestAnimationFrame(() => {
      this.history.scrollTop = this.history.scrollHeight;
    });
  }
}
