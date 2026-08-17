/**
 * Shared platform icon components — identical to CalendarView icons.
 * Import these anywhere you need Facebook / Instagram / LinkedIn logos.
 */
import svgPaths from './imports/svg-q05k7ytov1';

export function FacebookIcon() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <div className="absolute bg-[#337fff] inset-[0_-0.01%_0_0.01%] rounded-[10.591px]" />
      <div className="absolute inset-[25.11%_35.93%_24.84%_36.99%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.41425 10.0089">
          <path d={svgPaths.p3dc9c800} fill="white" />
        </svg>
      </div>
    </div>
  );
}

export function InstagramIcon() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <div
        className="absolute inset-0 rounded-[12px]"
        style={{
          backgroundImage:
            'linear-gradient(-45deg, rgb(251, 225, 138) 0.96099%, rgb(252, 187, 69) 21.961%, rgb(247, 82, 116) 38.961%, rgb(213, 54, 146) 52.961%, rgb(143, 57, 206) 74.961%, rgb(91, 79, 233) 100.96%)',
        }}
      >
        <div className="absolute bottom-[24.85%] left-1/4 right-[24.97%] top-[25.11%]">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.0056 10.0089">
            <path d={svgPaths.p3e5d3500} fill="white" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function LinkedInIcon() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <div className="absolute bg-[#0a66c2] inset-0 rounded-[12px]" />
      <div className="absolute inset-[30.22%_29.15%_29.74%_29%]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.36943 8.00711">
          <path d={svgPaths.p36823500} fill="white" />
        </svg>
      </div>
    </div>
  );
}

export function PlatformIcons({ platforms }: { platforms: ('facebook' | 'instagram' | 'linkedin')[] }) {
  return (
    <div className="flex items-center gap-[8px]">
      {platforms.includes('facebook')  && <FacebookIcon />}
      {platforms.includes('instagram') && <InstagramIcon />}
      {platforms.includes('linkedin')  && <LinkedInIcon />}
    </div>
  );
}
