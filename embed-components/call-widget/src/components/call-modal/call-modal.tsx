import { Component, Prop, h, State, Watch, Method, Element } from '@stencil/core';

@Component({
  tag: 'call-modal',
  styleUrl: 'call-modal.css',
  shadow: true,
})
export class CallModal {
  @Element() el!: HTMLElement;
  @Prop() trigger?: string;
  @Prop({ mutable: true, reflect: true }) open: boolean = false;
  @State() triggerElement: HTMLElement | null = null;
  @State() isClosing: boolean = false;

  private observer: MutationObserver | null = null;

  componentWillLoad() {
    if (this.trigger) {
      this.triggerElement = document.getElementById(this.trigger);
      if (this.triggerElement) {
        this.triggerElement.addEventListener('click', () => this.setOpen(true));
      } else {
        this.setupTriggerObserver();
      }
    }
  }

  disconnectedCallback() {
    if (this.triggerElement) {
      this.triggerElement.removeEventListener('click', () => this.setOpen(true));
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupTriggerObserver() {
    this.observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          for (const node of addedNodes) {
            if (node instanceof HTMLElement && node.id === this.trigger) {
              this.triggerElement = node;
              this.triggerElement.addEventListener('click', () => this.setOpen(true));
              this.observer?.disconnect();
              break;
            }
          }
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  @Watch('open')
  async openChanged(newValue: boolean) {
    if (!this.trigger) {
      if (!newValue && !this.isClosing) {
        this.handleClose();
      } else {
        this.open = newValue;
        this.isClosing = false;
        if (newValue) {
          await this.handleOpen();
        }
      }
    }
  }

  @Method()
  async setOpen(value: boolean) {
    if (!value && !this.isClosing) {
      this.handleClose();
    } else {
      this.open = value;
      this.isClosing = false;
      if (value) {
        await this.handleOpen();
      }
    }
  }

  private async handleOpen() {
    const callContext = this.el.querySelector('call-context');
    if (callContext) {
      try {
        await (callContext as any).dial();
      } catch (error) {
        console.error('Failed to dial:', error);
      }
    }
  }

  private handleClose() {
    this.isClosing = true;
    setTimeout(() => {
      this.open = false;
      this.isClosing = false;
    }, 800);
  }

  render() {
    if (!this.open && !this.isClosing) {
      return null;
    }

    const overlayClass = this.isClosing ? 'modal-overlay closing' : 'modal-overlay';
    const contentClass = `modal-content ${this.isClosing ? 'closing' : ''}`;

    return (
      <div class={overlayClass}>
        <div class={contentClass}>
          <button class="close-button" onClick={() => this.setOpen(false)}>
            ×
          </button>
          <slot></slot>
        </div>
      </div>
    );
  }
}
