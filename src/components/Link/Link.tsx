import type { LinkAsAnchorProps, LinkAsButtonProps, LinkProps } from './Link.types'

const LINK_BASE =
  'text-text-action no-underline hover:no-underline hover:text-primary-hover'

export function Link(props: LinkProps) {
  const { className = '', children } = props
  const classes = [LINK_BASE, className].filter(Boolean).join(' ')

  if (props.as === 'button') {
    const { as: _as, className: _className, ...buttonProps } = props as LinkAsButtonProps
    return (
      <button type="button" {...buttonProps} className={classes}>
        {children}
      </button>
    )
  }

  const { as: _as, className: _className, ...anchorProps } = props as LinkAsAnchorProps
  return (
    <a {...anchorProps} className={classes}>
      {children}
    </a>
  )
}
