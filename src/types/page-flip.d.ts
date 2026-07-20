declare module 'page-flip' {
  export interface PageFlipSettings {
    width: number
    height: number
    size?: 'fixed' | 'stretch'
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
    drawShadow?: boolean
    flippingTime?: number
    usePortrait?: boolean
    startZIndex?: number
    autoSize?: boolean
    maxShadowOpacity?: number
    showCover?: boolean
    mobileScrollSupport?: boolean
    swipeDistance?: number
    clickEventForward?: boolean
    useMouseEvents?: boolean
    disableFlipByClick?: boolean
    startPage?: number
  }

  export interface FlipEvent {
    data: number
    object: PageFlip
  }

  export class PageFlip {
    constructor(element: HTMLElement, settings: PageFlipSettings)
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void
    loadFromImages(images: string[]): void
    flipNext(corner?: 'top' | 'bottom'): void
    flipPrev(corner?: 'top' | 'bottom'): void
    flip(page: number, corner?: 'top' | 'bottom'): void
    getCurrentPageIndex(): number
    getPageCount(): number
    on(event: 'flip' | 'changeOrientation' | 'changeState' | 'init' | 'update', cb: (e: FlipEvent) => void): void
    destroy(): void
    update(): void
  }
}
