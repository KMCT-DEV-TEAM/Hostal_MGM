import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: false,
  width: 'auto',
  customClass: {
    popup: '!rounded-lg !px-4 !py-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-100 mt-4 mr-4 bg-white',
    htmlContainer: '!m-0 !p-0',
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export const showSuccessToast = (title, text = '') => {
  return Toast.fire({
    html: `
      <div class="flex items-center gap-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="11" stroke="#65A30D" stroke-width="1.2" />
            <path d="M7 12.5L10.5 16L17.5 8" stroke="#65A30D" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="text-[14px] font-medium text-black m-0 p-0">${text || title}</span>
      </div>
    `
  });
};

export const showErrorToast = (title, text = '') => {
  return Toast.fire({
    html: `
      <div class="flex items-center gap-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="11" stroke="#EF4444" stroke-width="1.2" />
            <path d="M8.5 8.5L15.5 15.5M15.5 8.5L8.5 15.5" stroke="#EF4444" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="text-[14px] font-medium text-black m-0 p-0">${text || title}</span>
      </div>
    `
  });
};
