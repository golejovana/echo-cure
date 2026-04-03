import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = "BCt_2X-EE6r4Oto-weRunej9Zr5bD1P5eGrsjuW_U7NzZ40aoXNbQ95roqrpkn8X7JUG1SUYiXYAMXUcyHIoVaY";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const subscribed = useRef(false);

  useEffect(() => {
    if (subscribed.current) return;
    subscribed.current = true;

    async function setup() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("Push notifications not supported in this browser.");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Notification permission denied.");
          return;
        }

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisuallyIndicatesUserGesture: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          } as PushSubscriptionOptionsInit);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const subJson = subscription.toJSON();

        // Save to profiles using cast to bypass generated types
        await (supabase.from("profiles") as any).update({
          push_subscription: subJson,
        }).eq("user_id", user.id);

        console.log("Push subscription saved.");
      } catch (err) {
        console.error("Push subscription error:", err);
      }
    }

    setup();
  }, []);
}
