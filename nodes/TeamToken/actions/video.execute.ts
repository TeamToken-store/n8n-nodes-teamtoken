import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import { apiRequest } from '../transport';
import { pollJob, raiseIfFailed, splitInputs, videoItemsFromResponse } from '../helpers';

/** Business logic for the Video resource (Generate / Extend / Get Job), one item. */
export async function runVideo(
	this: IExecuteFunctions,
	itemIndex: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	if (operation === 'getJob') {
		const jobId = this.getNodeParameter('jobId', itemIndex) as string;
		const response = await apiRequest.call(this, 'GET', `/v1/videos/${jobId}`);
		raiseIfFailed.call(this, response, itemIndex, 'Video job');
		return [{ json: response, pairedItem: { item: itemIndex } }];
	}

	const model = this.getNodeParameter('model', itemIndex) as string;
	const prompt = this.getNodeParameter('prompt', itemIndex) as string;
	const options = this.getNodeParameter('videoOptions', itemIndex, {}) as IDataObject;
	const refImages = splitInputs(this.getNodeParameter('referenceImages', itemIndex, '') as string);
	const refVideo = (this.getNodeParameter('referenceVideo', itemIndex, '') as string).trim();

	const body: IDataObject = { model, prompt };
	if (options.aspect_ratio) body.aspect_ratio = options.aspect_ratio;
	if (options.duration) body.duration = options.duration;
	if (refImages.length > 0) body.images = refImages;
	if (refVideo) body.video = refVideo;
	if (operation === 'extend') {
		body.ref_video_job_id = this.getNodeParameter('refVideoJobId', itemIndex) as string;
	}

	// Submit asynchronously and poll the status endpoint, which returns HTTP 200
	// for both completed and failed jobs — so failures arrive as data, not as
	// thrown 5xx. This keeps the failure path uniform with Get Job.
	const endpoint = operation === 'extend' ? '/v1/videos/extend' : '/v1/videos';
	const submit = await apiRequest.call(this, 'POST', endpoint, body);
	const jobId = submit.id as string | undefined;

	const wait = this.getNodeParameter('waitForCompletion', itemIndex, true) as boolean;
	if (!wait || !jobId) {
		return [{ json: submit, pairedItem: { item: itemIndex } }];
	}

	const maxWait = this.getNodeParameter('maxWaitSeconds', itemIndex, 300) as number;
	const interval = this.getNodeParameter('pollIntervalSeconds', itemIndex, 5) as number;
	const response = await pollJob.call(this, `/v1/videos/${jobId}`, maxWait, interval);

	raiseIfFailed.call(this, response, itemIndex, 'Video generation');

	const download = options.downloadVideo === true;
	const binaryProperty = (options.binaryProperty as string) || 'data';
	return videoItemsFromResponse.call(this, itemIndex, response, download, binaryProperty);
}
