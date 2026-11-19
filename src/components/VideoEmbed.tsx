interface Props {
  src: string;
  title: string;
}

export default function VideoEmbed({ src, title }: Props) {
  return (
    <iframe
      className='aspect-video w-full'
      src={src}
      title={title}
      allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen'
      allowFullScreen
      referrerPolicy='strict-origin-when-cross-origin'
    />
  );
}
