// Simulation engine for Aktogram local social network
import { VIRTUAL_PLAYERS, generateSmartComments } from "./aktogramAiService";

export const VIRTUAL_BOTS = VIRTUAL_PLAYERS;

// Helper to format metric counts into compact labels (e.g. 7.4k, 8.9k, 1.2M)
export function formatMetricNumber(num = 0) {
  if (!num || isNaN(num)) return "0";
  const abs = Math.abs(Number(num));
  if (abs >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (abs >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return String(num);
}

// Calculate emotional reactions and engagement based on elapsed time
export function simulatePostEngagement(post, currentTime = Date.now()) {
  const createdAt = new Date(post.createdAt).getTime();
  const elapsedMinutes = Math.max(0, (currentTime - createdAt) / (1000 * 60));

  // Base potential determined by unique post ID hash (deterministic yet natural)
  let hash = 0;
  for (let i = 0; i < (post.id || "").length; i++) {
    hash = (hash * 31 + post.id.charCodeAt(i)) & 0xffffffff;
  }
  const seed = Math.abs(hash);

  // Bonus for image presence and text length
  const hasImageBonus = post.imageUrl ? 1.5 : 1.0;
  const lengthBonus = post.text && post.text.length > 20 ? 1.25 : 1.0;
  const tagBonus = (post.tags && post.tags.length > 0) ? (1 + Math.min(post.tags.length, 5) * 0.1) : 1.0;

  const multiplier = (1.1 + (seed % 100) / 100) * hasImageBonus * lengthBonus * tagBonus;

  // Reaction capacities scaled up so popular posts hit 7k - 9k limits
  const maxLikes = Math.floor((3400 + (seed % 1000)) * multiplier);
  const maxFlames = Math.floor((2600 + (seed % 800)) * multiplier);
  const maxSparks = Math.floor((2100 + (seed % 600)) * multiplier);
  const maxDiamonds = Math.floor((1400 + (seed % 500)) * multiplier);
  const maxLaugh = Math.floor((1800 + (seed % 600)) * multiplier);
  const maxSkull = Math.floor((1200 + (seed % 400)) * multiplier);
  const maxSad = Math.floor((800 + (seed % 300)) * multiplier);
  const maxAngry = Math.floor((600 + (seed % 250)) * multiplier);

  // Growth progression [0 to 1] using saturation formula
  // Fast rise initially, gentle plateau towards 7k-9k
  const growth = elapsedMinutes / (elapsedMinutes + 90);

  const calculatedLikes = Math.floor(maxLikes * growth);
  const calculatedFlames = Math.floor(maxFlames * growth);
  const calculatedSparks = Math.floor(maxSparks * growth);
  const calculatedDiamonds = Math.floor(maxDiamonds * growth);
  const calculatedLaugh = Math.floor(maxLaugh * growth);
  const calculatedSkull = Math.floor(maxSkull * growth);
  const calculatedSad = Math.floor(maxSad * growth);
  const calculatedAngry = Math.floor(maxAngry * growth);

  // Preserve existing comments if already present, or generate initial contextual comments if empty
  let existingComments = post.comments || [];
  if (existingComments.length === 0 && (post.text || post.imageUrl)) {
    existingComments = generateSmartComments(post.text, post.tags || [], Math.min(3, Math.max(1, Math.floor(growth * 3) + 1)));
  }

  // Merge user's own toggle reactions
  const userReacted = post.userReacted || {};

  return {
    ...post,
    reactions: {
      likes: Math.max(post.reactions?.likes || 0, calculatedLikes) + (userReacted.likes ? 1 : 0),
      flames: Math.max(post.reactions?.flames || 0, calculatedFlames) + (userReacted.flames ? 1 : 0),
      sparks: Math.max(post.reactions?.sparks || 0, calculatedSparks) + (userReacted.sparks ? 1 : 0),
      diamonds: Math.max(post.reactions?.diamonds || 0, calculatedDiamonds) + (userReacted.diamonds ? 1 : 0),
      laugh: Math.max(post.reactions?.laugh || 0, calculatedLaugh) + (userReacted.laugh ? 1 : 0),
      skull: Math.max(post.reactions?.skull || 0, calculatedSkull) + (userReacted.skull ? 1 : 0),
      sad: Math.max(post.reactions?.sad || 0, calculatedSad) + (userReacted.sad ? 1 : 0),
      angry: Math.max(post.reactions?.angry || 0, calculatedAngry) + (userReacted.angry ? 1 : 0),
    },
    comments: existingComments,
    views: Math.max(
      post.views || 0, 
      Math.floor((calculatedLikes + calculatedFlames + calculatedSparks + calculatedLaugh + calculatedSkull + calculatedSad + calculatedAngry + 25) * 2.4)
    )
  };
}
