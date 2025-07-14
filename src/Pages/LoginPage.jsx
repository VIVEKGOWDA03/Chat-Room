import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import CountrySelect from "../components/CountrySelect";
import toast, { Toaster } from "react-hot-toast";

const phoneSchema = z.object({
  countryCode: z.string().min(1, "Country code is required"),
  phoneNumber: z
    .string()
    .min(6, "Phone number must be at least 6 digits")
    .regex(/^\d+$/, "Invalid phone number format"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must be numeric"),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, simulateOtp, verifyOtp } = useAuthStore();
  const [step, setStep] = useState("phone"); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [actualOtp, setActualOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentSchema = step === "phone" ? phoneSchema : otpSchema;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(currentSchema),
  });

  const onSubmitPhone = async (data) => {
    setIsSubmitting(true);
    try {
      const fullPhoneNumber = `${data.countryCode}${data.phoneNumber}`;
      const simulatedOtpCode = await simulateOtp(fullPhoneNumber);

      setPhoneNumber(data.phoneNumber);
      setCountryCode(data.countryCode);
      setActualOtp(simulatedOtpCode);

      toast.success(`OTP sent! Simulated OTP: ${simulatedOtpCode}`);
      setStep("otp");

      reset();
    } catch (error) {
      toast.error("Failed to send OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitOtp = async (data) => {
    setIsSubmitting(true);
    try {
      await verifyOtp(data.otp, actualOtp);

      login({
        phone: `${countryCode}${phoneNumber}`,
        id: Math.random().toString(36).substr(2, 9),
      });

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob absolute top-10 left-1/4"></div>
        <div className="w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 absolute bottom-1/4 right-10"></div>
        <div className="w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 absolute top-1/3 left-10"></div>
      </div>
      <div className="bg-white p-8 z-10 rounded-lg shadow-xl w-full max-w-md">
        <Toaster />
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
          Gemini Clone
        </h1>
        <h2 className="text-xl mb-6 text-center">
          {step === "phone" ? "Login or Signup" : "Enter OTP"}
        </h2>

        {step === "phone" ? (
          // Phone Input Form
          <form onSubmit={handleSubmit(onSubmitPhone)} className="space-y-4">
            <div>
              <label
                htmlFor="countryCode"
                className="block text-sm font-medium text-gray-700"
              >
                Country Code
              </label>

              {/* Use Controller to register CountrySelect */}
              <Controller
                name="countryCode"
                control={control}
                render={({ field }) => (
                  <CountrySelect
                    onChange={field.onChange}
                    value={field.value}
                    ref={field.ref}
                  />
                )}
              />
              {errors.countryCode && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.countryCode.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                {...register("phoneNumber")}
                placeholder="e.g., 9876543210"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          // OTP Input Form
          <form onSubmit={handleSubmit(onSubmitOtp)} className="space-y-4">
            <p className="text-sm text-gray-600">
              Please enter the 6-digit OTP sent to {countryCode}
              {phoneNumber}.
            </p>
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700"
              >
                OTP
              </label>
              <input
                id="otp"
                type="text"
                maxLength="6"
                className="mt-1 block w-full px-3 py-2 text-center text-2xl border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 tracking-wider"
                {...register("otp")}
              />
              {errors.otp && (
                <p className="text-red-500 text-xs mt-1 text-center">
                  {errors.otp.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
