import {
	NodeOperationError,
	sleep,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
} from 'n8n-workflow';

import { apiRequest, downloadVideoBinary } from '../transport';

// A media job that has not reached a terminal state yet. Mirrors the gateway's
// own open statuses; anything else means the job is finished (completed/failed).
export const OPEN_STATUSES = ['queued', 'processing', 'unknown_submit'];

export type CatalogRow = {
	model: string;
	modality: 'image' | 'video';
	billing_unit: string;
	unit_price_usd: number;
};

/**
 * Split a user-entered multi-value string (reference images / video) into a list
 * of trimmed URLs / data-URLs / base64 strings. Both newlines and commas
 * separate — but a data-URL / base64 blob can itself contain commas, so we only
 * split on commas when no newline was used as a separator.
 */
export function splitInputs(raw: string): string[] {
	if (!raw) return [];
	const lines = raw
		.split('\n')
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	const out: string[] = [];
	for (const line of lines) {
		// A data-URL always carries a comma (after ";base64,") and bare base64 may
		// too, so comma-splitting those would corrupt them — only comma-split lines
		// that are plain http(s) URL lists. data-URLs / base64 go one per line.
		if (line.startsWith('data:') || !/^https?:\/\//i.test(line)) {
			out.push(line);
		} else {
			out.push(...line.split(',').map((s) => s.trim()).filter((s) => s.length > 0));
		}
	}
	return out;
}

/**
 * Poll a job's status endpoint until it leaves the open states, or the wait
 * budget runs out. The gateway's GET routes return HTTP 200 for BOTH completed
 * and failed jobs, so a failure comes back as data here rather than as a thrown
 * error — the caller decides how to surface it. On timeout the last (still-open)
 * body is returned so a later node can keep polling.
 */
export async function pollJob(
	this: IExecuteFunctions,
	statusPath: string,
	maxWaitSeconds: number,
	intervalSeconds: number,
): Promise<IDataObject> {
	const deadline = Date.now() + maxWaitSeconds * 1000;
	let last = await apiRequest.call(this, 'GET', statusPath);
	while (OPEN_STATUSES.includes(last.status as string)) {
		const remaining = deadline - Date.now();
		if (remaining <= 0) break;
		// Never sleep past the deadline: with a large poll interval and a small Max
		// Wait the old code overshot the budget by nearly a full interval.
		await sleep(Math.min(Math.max(1, intervalSeconds) * 1000, remaining));
		last = await apiRequest.call(this, 'GET', statusPath);
	}
	return last;
}

/** Turn a completed image response ({ data: [{ b64_json }] }) into n8n items,
 * optionally as binary attachments. */
export async function imageItemsFromResponse(
	this: IExecuteFunctions,
	itemIndex: number,
	response: IDataObject,
	asBinary: boolean,
	binaryProperty: string,
): Promise<INodeExecutionData[]> {
	const data = (response.data as IDataObject[]) ?? [];
	if (!asBinary || data.length === 0) {
		return [{ json: response, pairedItem: { item: itemIndex } }];
	}
	const out: INodeExecutionData[] = [];
	for (let k = 0; k < data.length; k++) {
		const b64 = data[k].b64_json as string | undefined;
		if (!b64) continue;
		const buffer = Buffer.from(b64, 'base64');
		const fileName = `image_${k + 1}.png`;
		const binary = await this.helpers.prepareBinaryData(buffer, fileName, 'image/png');
		out.push({
			json: { cost_usd: response.cost_usd, id: response.id, index: k },
			binary: { [binaryProperty]: binary },
			pairedItem: { item: itemIndex },
		});
	}
	return out.length > 0 ? out : [{ json: response, pairedItem: { item: itemIndex } }];
}

/** Fetch each completed-video content URL through the authenticated gateway and
 * attach the MP4 bytes as binary. */
export async function videoItemsFromResponse(
	this: IExecuteFunctions,
	itemIndex: number,
	response: IDataObject,
	download: boolean,
	binaryProperty: string,
): Promise<INodeExecutionData[]> {
	const data = (response.data as IDataObject[]) ?? [];
	if (!download || data.length === 0) {
		return [{ json: response, pairedItem: { item: itemIndex } }];
	}
	const out: INodeExecutionData[] = [];
	for (let k = 0; k < data.length; k++) {
		const rawUrl = data[k].url as string | undefined;
		if (!rawUrl) continue;
		const bytes = await downloadVideoBinary.call(this, rawUrl, itemIndex);
		const fileName = `video_${k + 1}.mp4`;
		const binary = await this.helpers.prepareBinaryData(bytes, fileName, 'video/mp4');
		out.push({
			json: {
				cost_usd: response.cost_usd,
				duration: response.duration,
				id: response.id,
				index: k,
			},
			binary: { [binaryProperty]: binary },
			pairedItem: { item: itemIndex },
		});
	}
	return out.length > 0 ? out : [{ json: response, pairedItem: { item: itemIndex } }];
}

/** A media job can be reported failed as HTTP 200 with status "failed" (e.g. a
 * content-filter rejection). Surface that as a node error so Get Job behaves the
 * same as Generate/Extend — otherwise a failed job fetched via Get Job would look
 * like a success and the workflow would continue silently. */
export function raiseIfFailed(
	this: IExecuteFunctions,
	response: IDataObject,
	itemIndex: number,
	what: string,
): void {
	if (response.status === 'failed') {
		throw new NodeOperationError(
			this.getNode(),
			(response.error as IDataObject)?.message?.toString() ?? `${what} failed`,
			{ itemIndex },
		);
	}
}
