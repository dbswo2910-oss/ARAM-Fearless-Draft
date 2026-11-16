import { avatarUrl } from './format';

export default function Avatar({ name, avatar, size = 36, className = '' }: { name: string; avatar?: string | null; size?: number; className?: string }) {
  const url = avatarUrl(avatar);
  return (
    <div className={`avatar ${className}`} style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {url ? <img src={url} alt="" /> : name.slice(0, 1)}
    </div>
  );
}
