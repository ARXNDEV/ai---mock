// Ambient types for the Razorpay Checkout script (checkout.js), loaded at runtime.
interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  order_id: string;
  amount: number | string;
  currency: string;
  name?: string;
  description?: string;
  image?: string;
  theme?: { color?: string };
  prefill?: { name?: string; email?: string; contact?: string };
  handler?: (response: RazorpayCheckoutResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open(): void;
}

interface Window {
  Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
}
