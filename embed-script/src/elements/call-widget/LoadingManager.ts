import loadingUI from "../../ui/loading.html";

export class LoadingManager {
  private element: HTMLElement;
  private isLoading: boolean = false;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  setLoading(loading: boolean) {
    if (this.isLoading === loading) return;

    this.isLoading = loading;
    this.render();
  }

  private render() {
    const existingLoader = this.element.querySelector(".loading");
    if (this.isLoading) {
      if (!existingLoader) {
        const { loading } = loadingUI();
        this.element.appendChild(loading);
      }
    } else {
      existingLoader?.remove();
    }
  }
}
