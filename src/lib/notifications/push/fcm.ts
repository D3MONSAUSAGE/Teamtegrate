export interface SendPushOptions {
  toTokens?: string[];
  toTopic?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function sendPush(options: SendPushOptions) {
  try {
    if (!process.env.FCM_SERVER_KEY) {
      console.warn('[FCM] Server key not configured, skipping push notification');
      return { ok: false, error: 'FCM_SERVER_KEY not configured' };
    }

    const fcmServerKey = process.env.FCM_SERVER_KEY;
    const url = 'https://fcm.googleapis.com/fcm/send';

    // Determine target - either tokens or topic
    let targets: any = {};
    if (options.toTopic) {
      targets.to = `/topics/${options.toTopic}`;
    } else if (options.toTokens && options.toTokens.length > 0) {
      if (options.toTokens.length === 1) {
        targets.to = options.toTokens[0];
      } else {
        targets.registration_ids = options.toTokens;
      }
    } else {
      return { ok: false, error: 'No valid targets provided (tokens or topic)' };
    }

    const payload = {
      ...targets,
      notification: {
        title: options.title,
        body: options.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      },
      data: {
        ...options.data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        notification: {
          sound: 'default',
          channel_id: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${fcmServerKey}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[FCM] Failed to send push notification:', {
        status: response.status,
        result,
        payload: { ...payload, notification: { title: options.title } } // Don't log full content
      });
      return { ok: false, status: response.status, error: result?.error || 'Unknown FCM error' };
    }

    console.log('[FCM] Push notification sent successfully:', {
      success: result.success || 0,
      failure: result.failure || 0,
      targets: options.toTopic ? `topic:${options.toTopic}` : `${options.toTokens?.length || 0} tokens`
    });

    return { 
      ok: true, 
      status: response.status, 
      result: {
        success: result.success || 0,
        failure: result.failure || 0
      }
    };
  } catch (error: any) {
    console.error('[FCM] Error sending push notification:', {
      error: error.message,
      title: options.title
    });

    return { ok: false, error: String(error.message || error) };
  }
}