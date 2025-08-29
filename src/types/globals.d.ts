export {};

declare global {
  interface Window {
    firebase: any;
    storageService: any;
    pdfService: any;
    auditoriaService: any;
    formatarDataHora: (...args: any[]) => string;
  }
}
