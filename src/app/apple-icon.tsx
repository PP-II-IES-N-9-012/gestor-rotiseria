import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #d34e2c 0%, #992c10 100%)',
          borderRadius: 38,
        }}
      >
        {/* Flame */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100"
          height="100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffd5a8"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2C6.5 6.5 3 11 3 15a9 9 0 0 0 18 0c0-4-3.5-8.5-9-13Z" fill="#f7b045" stroke="none" />
          <path d="M12 12c-2 2-3 4-3 6a3 3 0 0 0 6 0c0-2-1-4-3-6Z" fill="#d34e2c" stroke="none" opacity="0.75" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
