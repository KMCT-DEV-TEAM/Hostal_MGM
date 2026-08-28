export const verifyOtpDb = async (email, otp) => {
    console.log(`Stub: verifyOtpDb called for ${email} with OTP ${otp}`);
    return true; // Stub: always valid
};

export const deleteOtpDb = async (email) => {
    console.log(`Stub: deleteOtpDb called for ${email}`);
};

export const getOrCreateOtp = async (email) => {
    console.log(`Stub: getOrCreateOtp called for ${email}`);
    return { otpCode: "123456" }; // Stub OTP code
};

export const saveOtpDb = async (email, otpCode) => {
    console.log(`Stub: saveOtpDb called for ${email} with OTP ${otpCode}`);
};
