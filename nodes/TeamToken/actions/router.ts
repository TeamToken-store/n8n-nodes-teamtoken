import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import { runImage } from './image.execute';
import { runVideo } from './video.execute';

/** Dispatch one input item to the resource's operation handler. */
export async function route(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	return resource === 'image'
		? runImage.call(this, itemIndex, operation)
		: runVideo.call(this, itemIndex, operation);
}
