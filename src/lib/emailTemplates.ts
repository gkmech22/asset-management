import { Asset } from "@/hooks/useAssets";

export const generateDispatchEmailSubject = (asset: Asset): string => {
  return `Asset Dispatch - ${asset.name} (${asset.asset_id})`;
};

export const generateDispatchEmailBody = (asset: Asset): string => {
  return `Dear ${asset.assigned_to || 'Recipient'},

This email is to inform you that the following asset has been dispatched to you:

Asset ID: ${asset.asset_id}
Asset Name: ${asset.name}
Asset Type: ${asset.type}
Brand: ${asset.brand}
Serial Number: ${asset.serial_number}
Configuration: ${asset.configuration || 'N/A'}
Location: ${asset.location}
Assigned Date: ${asset.assigned_date ? new Date(asset.assigned_date).toLocaleDateString() : 'N/A'}

Please confirm receipt of this asset.

Best regards,
Asset Management Team`;
};

export const generateReceiveEmailSubject = (asset: Asset): string => {
  return `Asset Received - ${asset.name} (${asset.asset_id})`;
};

export const generateReceiveEmailBody = (asset: Asset): string => {
  return `Dear Team,

This email is to confirm that the following asset has been received:

Asset ID: ${asset.asset_id}
Asset Name: ${asset.name}
Asset Type: ${asset.type}
Brand: ${asset.brand}
Serial Number: ${asset.serial_number}
Configuration: ${asset.configuration || 'N/A'}
Received By: ${asset.received_by || 'N/A'}
Return Date: ${asset.return_date ? new Date(asset.return_date).toLocaleDateString() : 'N/A'}
Location: ${asset.location}
Status: ${asset.status}
Asset Condition: ${asset.asset_condition || 'N/A'}

Best regards,
Asset Management Team`;
};

export const openGmailCompose = (subject: string, body: string) => {
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(gmailUrl, '_blank');
};
