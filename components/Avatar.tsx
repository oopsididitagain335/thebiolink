'use client';

interface AvatarProps {
  name: string;
  avatar?: string;
}

export default function Avatar({ name, avatar }: AvatarProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(avatar);

  const handleError = () => {
    console.log(`Failed to load avatar for ${name}: ${avatar}`);
    setImgSrc('/fallback-avatar.png');
  };

  return avatar && imgSrc ? (
    <img
      src={imgSrc}
      alt={name}
      className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white/30"
      onError={handleError}
    />
  ) : (
    <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
      <span className="text-4xl text-white font-bold">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
