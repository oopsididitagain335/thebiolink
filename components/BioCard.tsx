import Image from 'next/image';

export default function BioCard({ name, avatar, bio }: { name: string; avatar?: string; bio?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 text-center">
      {avatar ? (
        <Image
          src={avatar}
          alt={name}
          width={100}
          height={100}
          className="rounded-full mx-auto mb-4"
        />
      ) : (
        <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl text-white font-bold">{name.charAt(0)}</span>
        </div>
      )}
      
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{name}</h1>
      
      {bio && (
        <p className="text-gray-600 mb-6">{bio}</p>
      )}
    </div>
  );
}
