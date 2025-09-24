import Image from 'next/image';

export default function LinkCard({ url, title, icon }: { url: string; title: string; icon?: string }) {
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="bg-white rounded-lg shadow-md p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
    >
      {icon ? (
        <Image
          src={icon}
          alt={title}
          width={24}
          height={24}
          className="w-6 h-6 text-gray-500"
        />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a2 2 0 00-2.828 0l-6 6a2 2 0 002.828 2.828l6-6a2 2 0 000-2.828z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17.25V21h3.75C8.55 21 10.69 19.75 11.5 18.25a10.05 10.05 0 0011-11C22.49 6.35 20.7 4.5 18.25 4.5h-3.75" />
        </svg>
      )}
      
      <div className="flex-1">
        <h3 className="text-gray-800 font-medium">{title}</h3>
        <p className="text-sm text-gray-500 truncate">{url}</p>
      </div>
      
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
