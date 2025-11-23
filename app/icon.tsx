import { ImageResponse } from 'next/og'
import crypto from "crypto";
import { getMaxListeners } from 'events';
 
// Image metadata
export const size = {
  width: 2048,
  height: 2048,
}
export const contentType = 'image/png'
 
function getGravatarHash(email: string) {
  email = email.trim().toLowerCase();
   
  const hash = crypto.createHash('sha256').update(email).digest('hex');
   
  return hash;
}
 
export default function Icon() {
  const hash = getGravatarHash('latificlynch@gmail.com')

  return new ImageResponse(
    (
      <img
        src={`https://0.gravatar.com/avatar/${hash}?s=2048`}
        alt=""
        width={80}
        height={80}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '9999px'
        }}
      />
    ),
    {
      ...size,
    }
  )
}