import React from 'react';

const Loader = ({ fullScreen = false }) => {
  const loaderContent = (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-3 h-3 bg-[#0A467F] rounded-full animate-[bounce_1.4s_infinite_ease-in-out] [animation-delay:-0.32s]"></div>
      <div className="w-3 h-3 bg-[#0A467F] rounded-full animate-[bounce_1.4s_infinite_ease-in-out] [animation-delay:-0.16s]"></div>
      <div className="w-3 h-3 bg-[#0A467F] rounded-full animate-[bounce_1.4s_infinite_ease-in-out]"></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#185EA5]/10">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {loaderContent}
    </div>
  );
};

export default Loader;
