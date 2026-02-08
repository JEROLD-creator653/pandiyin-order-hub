const badges = [
  { logo: '/Quality_Assured.png', text: 'Quality Assured' },
  { logo: '/zero_preservatives.png', text: '0% Preservatives' },
  { logo: '/zero_chemicals.png', text: 'Zero Chemicals' },
  { logo: '/Natural.png', text: '100% Natural' },
  { logo: '/FSSAI.png', text: 'FSSAI Approved' },
];

export default function TrustBadges() {
  // Duplicate badges for seamless infinite loop
  const duplicatedBadges = [...badges, ...badges];

  return (
    <>
      {/* CSS Marquee Animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .marquee-track {
          animation: marquee 24s linear infinite;
        }
        
        .marquee-track:hover {
          animation-play-state: paused;
        }
        
        /* Remove white space from logos */
        .badge-logo-no-whitespace {
          /* Scale image to fill container and minimize white space */
          object-fit: contain;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: glitter 3s ease-in-out infinite;
        }

        .badge-logo-no-whitespace:hover {
          transform: scale(1.25);
        }

        @keyframes glitter {
          0%, 100% { filter: brightness(100%) drop-shadow(0 0 0 transparent); }
          50% { filter: brightness(120%) drop-shadow(0 0 5px rgba(255,255,255,0.6)); }
        }
        
        @media (max-width: 768px) {
          .badge-logo-container-mobile {
            width: 70px !important;
            height: 70px !important;
          }
          
          .badge-logo-mobile {
            width: 70px !important;
            height: 70px !important;
          }
          
          .badge-text-mobile {
            font-size: 13px !important;
          }
          
          .marquee-gap-mobile {
            gap: 80px !important;
          }
        }
      `}</style>
      
      {/* Marquee Strip */}
      <section 
        className="relative overflow-hidden w-full"
        style={{ 
          background: '#F7EFEF',
          height: '80px',
        }}
      >
        <div className="flex items-center h-full">
          <div 
            className="marquee-track marquee-gap-mobile flex items-center"
            style={{
              width: 'max-content',
              gap: '110px',
            }}
          >
            {duplicatedBadges.map((badge, index) => (
              <div
                key={index}
                className="flex items-center whitespace-nowrap"
                style={{
                  gap: '16px',
                }}
              >
                {/* Badge Logo - No White Space */}
                <div 
                  className="flex-shrink-0 badge-logo-container-mobile"
                  style={{
                    width: '85px',
                    height: '85px',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    margin: 0,
                  }}
                >
                  <img 
                    src={badge.logo} 
                    alt={badge.text}
                    className="badge-logo-no-whitespace"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      display: 'block',
                    }}
                  />
                </div>
                
                {/* Text */}
                <span 
                  className="font-medium badge-text-mobile"
                  style={{
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#6B7280',
                    letterSpacing: '0.3px',
                  }}
                >
                  {badge.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
