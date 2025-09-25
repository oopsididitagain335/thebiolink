import Image from 'next/image';

interface LinkCardProps {
  url: string;
  title: string;
  icon?: string;
}

export default function LinkCard({ url, title, icon }: LinkCardProps) {
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700"
    >
      {icon ? (
        <div className="relative w-6 h-6 flex-shrink-0">
          <Image
            src={icon}
            alt={title}
            fill
            className="object-contain"
            sizes="24px"
          />
        </div>
      ) : (
        <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a2 2 0 00-2.828 0l-6 6a2 2 0 002.828 2.828l6-6a2 2 0 000-2.828z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17.25V21h3.75C8.55 21 10.69 19.75 11.5 18.25a10.05 10.05 0 0011-11C22.49 6.35 20.7 4.5 18.25 4.5h-3.75" />
          </svg>
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h3 className="text-gray-800 dark:text-white font-medium truncate">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{url.replace(/^https?:\/\//, '')}</p>
      </div>
      
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
