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

        .badge-lift {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        /* Remove white space from logos */
        .badge-logo-no-whitespace {
          /* Scale image to fill container and minimize white space */
          object-fit: contain;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: glitter 3s ease-in-out infinite;
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
            gap: 160px !important;
          }
        }

        @media (min-width: 1024px) {
          .marquee-gap-desktop {
            gap: 220px !important;
          }
        }
      `}</style>
      
      {/* Marquee Strip */}
      <section 
        className="relative overflow-hidden w-full"
        style={{ 
          background: '#FFFFFF',
          height: '100px',
        }}
      >
        <div className="flex items-center h-full">
          <div 
            className="marquee-track marquee-gap-mobile marquee-gap-desktop flex items-center"
            style={{
              width: 'max-content',
              gap: '180px',
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
                  className="flex-shrink-0 badge-logo-container-mobile badge-lift rounded-full overflow-hidden"
                  style={{
                    width: '95px',
                    height: '95px',
                    background: '#FFFFFF',
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
                    className="badge-logo-no-whitespace rounded-full"
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