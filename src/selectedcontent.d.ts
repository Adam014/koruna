// <selectedcontent> (customizable select) is not in @types/react yet.
// https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/selectedcontent
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      selectedcontent: DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      >
    }
  }
}
