import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  width: 'auto',
  customClass: {
    popup: 'text-sm shadow-md rounded-xl !py-2 !px-4 mt-2 mr-2',
    title: 'text-[13px] font-medium !m-0 !mt-[2px] text-gray-700',
    icon: '!scale-75 !my-0 !ml-0', 
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export const showSuccessToast = (title, text = '') => {
  return Toast.fire({
    icon: 'success',
    title: text || title // Prefer the descriptive text, otherwise fallback to title
  });
};

export const showErrorToast = (title, text = '') => {
  return Toast.fire({
    icon: 'error',
    title: text || title,
    showCloseButton: true
  });
};
