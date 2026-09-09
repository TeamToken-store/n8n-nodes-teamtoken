import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import { apiRequest } from '../transport';
import { imageItemsFromResponse, pollJob, raiseIfFailed, splitInputs } from '../helpers';

/** Business logic for the Image resource (Generate / Edit / Get Job), one item. */
export async function runImage(
	this: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	if (operation === 'getJob') {
		const jobId = this.getNodeParameter('jobId', itemIndex) as string;
		const response = await apiRequest.call(this, 'GET', `/v1/images/jobs/${jobId}`);
		raiseIfFailed.call(this, response, itemIndex, 'Image job');
		// A completed async job carries the same { data: [{ b64_json }] } shape as a
		// synchronous generation, so decode it to binary here too — otherwise the
		// async path (Wait for Completion = false, then Get Job) silently returns
		// base64 JSON while Generate returns binary by default. A still-open job has
		// no data and imageItemsFromResponse falls through to the raw JSON body.
		return imageItemsFromResponse.call(this, itemIndex, response, true, 'data');
	}

	const model = this.getNodeParameter('model', itemIndex) as string;
	const prompt = this.getNodeParameter('prompt', itemIndex) as string;
	const options = this.getNodeParameter('imageOptions', itemIndex, {}) as IDataObject;
	const refs = splitInputs(this.getNodeParameter('referenceImages', itemIndex, '') as string);

	const body: IDataObject = { model, prompt };
	if (options.aspect_ratio) body.aspect_ratio = options.aspect_ratio;
	if (options.resolution) body.resolution = options.resolution;
	if (options.n) body.n = options.n;
	if (refs.length > 0) body.images = refs;

	// /edit is a generation with reference images; the gateway routes both the
	// same way, so we only switch the endpoint.
	const endpoint = operation === 'edit' ? '/v1/images/edits' : '/v1/images/generations';
	let response = await apiRequest.call(this, 'POST', endpoint, body);

	// Fast path: the gateway already polled internally and returned the images.
	// Slow path: it handed back { id, status: 'processing' } — optionally poll.
	const wait = this.getNodeParameter('waitForCompletion', itemIndex, true) as boolean;
	if (response.status === 'processing' && response.id && wait) {
		const maxWait = this.getNodeParameter('maxWaitSeconds', itemIndex, 300) as number;
		const interval = this.getNodeParameter('pollIntervalSeconds', itemIndex, 5) as number;
		response = await pollJob.call(
			this,
			`/v1/images/jobs/${response.id as string}`,
			maxWait,
			interval,
		);
	}

	raiseIfFailed.call(this, response, itemIndex, 'Image generation');

	const asBinary = options.returnBinary !== false;
	const binaryProperty = (options.binaryProperty as string) || 'data';
	return imageItemsFromResponse.call(this, itemIndex, response, asBinary, binaryProperty);
}
