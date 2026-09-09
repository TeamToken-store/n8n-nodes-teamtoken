import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestMethods,
	type IHttpRequestOptions,
} from 'n8n-workflow';

/** Credential type name, shared by every request path and the loadOptions methods. */
export const CRED = 'teamTokenApi';

/**
 * Normalize the entered Base URL. Strip a trailing slash AND a trailing /v1: the
 * Base URL may be entered with or without /v1 (the public API guide states it
 * WITH /v1), and every endpoint here already begins with /v1 — without this a
 * pasted ".../v1" would double to ".../v1/v1/...".
 */
function normalizeBaseUrl(baseUrl: string): string {
	return baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
}

/** Authenticated JSON request against the gateway's /v1 media routes. */
export async function apiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
): Promise<IDataObject> {
	const credentials = await this.getCredentials(CRED);
	const baseUrl = normalizeBaseUrl(credentials.baseUrl as string);
	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		json: true,
	};
	if (body !== undefined) options.body = body;
	return (await this.helpers.httpRequestWithAuthentication.call(
		this,
		CRED,
		options,
	)) as IDataObject;
}

/**
 * Fetch one completed-video content URL through the authenticated gateway and
 * return the raw MP4 bytes. The URL points at the gateway's own /content route,
 * never at a provider CDN. It may come back relative, so resolve it against the
 * configured API base, and attach the credential only when the target is that
 * same origin — the Bearer key must never reach a foreign host.
 */
export async function downloadVideoBinary(
	this: IExecuteFunctions,
	rawUrl: string,
	itemIndex: number,
): Promise<Buffer> {
	const credentials = await this.getCredentials(CRED);
	const apiBase = normalizeBaseUrl(credentials.baseUrl as string);
	const apiOrigin = new URL(apiBase).origin;
	const absUrl = new URL(rawUrl, `${apiBase}/`).toString();
	if (new URL(absUrl).origin !== apiOrigin) {
		throw new NodeOperationError(
			this.getNode(),
			`Refusing to download video from an unexpected host: ${new URL(absUrl).host}`,
			{ itemIndex },
		);
	}
	const buffer = (await this.helpers.httpRequestWithAuthentication.call(this, CRED, {
		method: 'GET',
		url: absUrl,
		encoding: 'arraybuffer',
	})) as Buffer;
	return Buffer.from(buffer);
}
