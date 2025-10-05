// app/[username]/page.tsx (only the widget rendering part changed)
// ... (imports and helpers same as before)

// Helper: Extract YouTube video ID
function getYouTubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.*?v=))([^&?# ]{11})/);
  return match ? match[1] : '';
}

// Helper: Extract Spotify embed path
function getSpotifyId(url: string): string {
  const match = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/);
  return match ? `${match[1]}/${match[2]}` : '';
}

// ... (rest of the file until widget rendering)

{widget.type === 'youtube' && widget.url ? (
  <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
    <iframe
      src={`https://www.youtube.com/embed/${getYouTubeId(widget.url)}`} // ✅ NO SPACE
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full"
    ></iframe>
  </div>
) : widget.type === 'spotify' && widget.url ? (
  <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
    <iframe
      src={`https://open.spotify.com/embed/${getSpotifyId(widget.url)}`} // ✅ NO SPACE
      frameBorder="0"
      allowTransparency={true}
      allow="encrypted-media"
      className="w-full h-full"
    ></iframe>
  </div>
) : widget.type === 'twitter' && widget.url ? (
  <div className="bg-gray-800 rounded-lg p-4">
    <a href={widget.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
      🐦 View Twitter Feed
    </a>
  </div>
) : widget.type === 'custom' && widget.content ? (
  <div
    className="text-gray-300 text-sm leading-relaxed"
    dangerouslySetInnerHTML={{ __html: widget.content }}
  />
) : (
  <div className="text-gray-400 text-sm italic">
    {widget.type === 'spotify' && '🎵 Spotify embed'}
    {widget.type === 'youtube' && '📺 YouTube video'}
    {widget.type === 'twitter' && '🐦 Twitter feed'}
    {!widget.type && 'Widget content'}
  </div>
)}
