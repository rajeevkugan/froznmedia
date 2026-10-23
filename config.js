// Edit this file to update the site's content — no other code changes needed.
window.FROZN = {
  // Latest Instagram posts from @froznmedia (post shortcodes + whether it's a reel).
  // Paste new ones at the top. Format: instagram.com/<reel|p>/<CODE>/
  instagram: [
    { type: 'reel', code: 'DerR4kxTPuI' },
    { type: 'reel', code: 'DezO0QZuwpZ' },
    { type: 'p',    code: 'Det-OX2Fpm7' },
    { type: 'reel', code: 'DefJIGRqJQO' },
    { type: 'reel', code: 'DeZcbV4TGKS' },
    { type: 'reel', code: 'DeSALJjP_CD' },
    { type: 'reel', code: 'DeO-kS7BTCb' },
    { type: 'reel', code: 'DeO-h9pqcXC' },
    { type: 'reel', code: 'DeKafr0R7yl' },
    { type: 'reel', code: 'DeIHpNUSJcW' },
  ],

  // Auto-playing reel previews (used instead of the Instagram embeds when this list isn't empty).
  // Drop vertical .mp4 files in assets/reels/ and list them here. `link` is where a click goes.
  reels: [
    { src: '/assets/reels/cerise-manor.mp4',  poster: '/assets/reels/cerise-manor.jpg',  title: '2637 Cerise Manor' },
    { src: '/assets/reels/foxden-sold.mp4',    poster: '/assets/reels/foxden-sold.jpg',    title: 'Foxden — Sold' },
    { src: '/assets/reels/wildwood-sold.mp4',  poster: '/assets/reels/wildwood-sold.jpg',  title: '2358 Wildwood — Sold Over Asking' },
    { src: '/assets/reels/kingfisher.mp4',     poster: '/assets/reels/kingfisher.jpg',     title: 'Kingfisher Listing' },
    { src: '/assets/reels/courtice.mp4',     poster: '/assets/reels/courtice.jpg',     title: 'Home in Courtice' },
    // { src: '/assets/reels/anirudh.mp4', poster: '/assets/reels/anirudh.jpg', title: 'Anirudh Live', link: 'https://www.instagram.com/reel/XXXX/' },
  ],

  // YouTube films to highlight. Add 11-character video IDs (the part after v=).
  // Leave empty and the "Featured films" section stays hidden.
  youtube: [
    // { id: 'dQw4w9WgXcQ', title: 'Anirudh Live — Concert Film' },
  ],

  trusted: ['Anirudh', 'Yuvan', '50 Cent', 'French Montana', 'CollegeTrackr', 'NCAA', 'KothuFest', 'High Quality Entertainment'],

  services: [
    { n: '01', t: 'Creative Ads', d: 'Concept-to-cut commercials and social ads engineered to convert.' },
    { n: '02', t: 'Personal Brand Marketing', d: 'Content systems for founders, artists and creators who want to be the name in their lane.' },
    { n: '03', t: 'Concert & Event Films', d: 'Multi-cam coverage, aftermovies and live content for stages of any size.' },
    { n: '04', t: 'AI-Driven Content', d: 'AI-powered workflows that multiply output without watering down the craft.' },
    { n: '05', t: 'AI Avatars', d: 'Your face, your voice, scaled — avatar content for multilingual and always-on campaigns.' },
    { n: '06', t: 'Social Campaigns', d: 'Reels, shorts and rollouts planned, shot and edited to dominate the feed.' },
  ],
};
