interface FCMOptions {
  tokens?: string[];
  topic?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface FCMSendResult {
  success: boolean;
  successCount?: number;
  failureCount?: number;
  results?: any[];
  error?: string;
}

class FCMPushAdapter {
  private serverKey: string | null = null;
  private fcmUrl = 'https://fcm.googleapis.com/fcm/send';

  constructor() {
    this.serverKey = process.env.FCM_SERVER_KEY || null;
    
    if (!this.serverKey) {
      console.warn('[FCM] FCM_SERVER_KEY not configured, push notifications disabled');
    }
  }

  async sendPush(options: FCMOptions): Promise<FCMSendResult> {
    if (!this.serverKey) {
      console.warn('[FCM] FCM not configured, skipping push notification');
      return { success: false, error: 'FCM not configured' };
    }

    try {
      // Determine target - either tokens or topic
      let targets: any = {};
      if (options.topic) {
        targets.to = `/topics/${options.topic}`;
      } else if (options.tokens && options.tokens.length > 0) {
        if (options.tokens.length === 1) {
          targets.to = options.tokens[0];
        } else {
          targets.registration_ids = options.tokens;
        }
      } else {
        return { success: false, error: 'No valid targets provided (tokens or topic)' };
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

      const response = await fetch(this.fcmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${this.serverKey}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('[FCM] Failed to send push notification:', {
          status: response.status,
          result
        });
        return { 
          success: false, 
          error: result?.error || 'Unknown FCM error'
        };
      }

      console.log('[FCM] Push notification sent successfully:', {
        success: result.success || 0,
        failure: result.failure || 0,
        targets: options.topic ? `topic:${options.topic}` : `${options.tokens?.length || 0} tokens`
      });

      return { 
        success: true,
        successCount: result.success || 0,
        failureCount: result.failure || 0,
        results: result.results
      };
    } catch (error: any) {
      console.error('[FCM] Error sending push notification:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  async sendBulkPush(notifications: FCMOptions[]): Promise<FCMSendResult[]> {
    const results: FCMSendResult[] = [];
    
    for (const notification of notifications) {
      const result = await this.sendPush(notification);
      results.push(result);
    }
    
    return results;
  }
}

export const fcmAdapter = new FCMPushAdapter();