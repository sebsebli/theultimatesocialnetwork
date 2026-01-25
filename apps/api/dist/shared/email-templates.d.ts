export interface EmailTemplate {
    subject: string;
    title: string;
    body: string;
    tokenLabel: string;
    ignore: string;
}
export declare const signInTokenTemplates: Record<string, EmailTemplate>;
