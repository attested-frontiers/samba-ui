import { ethers } from 'ethers';

// Function to send notification to Telegram bot
export async function createTGNotificationRequest(
    contract: `0x${string}`,
    user: string
) {
    // build the request
    const message = { contract, user };
    const stringifiedMessage = JSON.stringify(message);
    const signer = new ethers.Wallet(process.env.TG_NOTIFICATION_PRIVKEY!);
    const signature = await signer.signMessage(stringifiedMessage);
    try {
        const response = await fetch(process.env.TG_NOTIFICATION_SERVER_URL!, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signature
            },
            body: stringifiedMessage

        });
        if (!response.ok) {
            throw new Error(`Failed to send notification: ${response.statusText}`);
        }
        console.log('Notification sent successfully');
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
}