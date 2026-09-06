interface Props {
  color: 'reddish' | 'blueish';
}

export default function LightningIcon({ color }: Props) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='15'
      height='21'
      viewBox='0 0 15 21'
      fill='none'
      className={color === 'blueish' ? 'text-blueish' : 'text-reddish'}
      aria-hidden='true'
    >
      <path
        d='M3.38806 0.43335H14.503L10.2593 7.2287H13.9734L1.75914 20.5679L3.89108 12.0028H0.49707L3.38806 0.43335ZM12.0244 1.8052H4.46268L2.25489 10.631H5.64706L4.3941 15.6566L10.8565 8.60058H7.78442L12.0244 1.8052Z'
        fill='currentColor'
      />
    </svg>
  );
}
