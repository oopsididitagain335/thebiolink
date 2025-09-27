// components/BioCard.tsx
interface BioCardProps {
  name: string;
  avatar?: string;
  bio?: string;
}

export default function BioCard({ name, avatar, bio }: BioCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
      {avatar ? (
        <img 
          src={avatar} 
          alt={name} 
          className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white/30"
        />
      ) : (
        <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl text-white font-bold">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      
      <h1 className="text-2xl font-bold text-white mb-2">{name}</h1>
      
      {bio && <p className="text-gray-200 mb-6 max-w-xs mx-auto">{bio}</p>}
      
      <div className="flex justify-center space-x-2 mt-2">
        <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
      </div>
    </div>
  );
}
