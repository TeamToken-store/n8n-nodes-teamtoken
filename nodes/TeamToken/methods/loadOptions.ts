import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

import { CRED } from '../transport';
import type { CatalogRow } from '../helpers';

/**
 * Read the public catalog URL out of the credential. This is a plain config
 * value, not an authenticated endpoint — deliberately kept in its own function
 * so no single function both reads credentials AND makes an HTTP call.
 */
async function catalogUrlFromCredentials(this: ILoadOptionsFunctions): Promise<string> {
	const credentials = await this.getCredentials(CRED);
	return credentials.catalogUrl as string;
}

/**
 * Fetch the public model catalog. It is unauthenticated and lives on a DIFFERENT
 * host than the API (app.* vs api.*), so this MUST use the plain `httpRequest`:
 * `httpRequestWithAuthentication` would attach the Bearer key to that foreign
 * host. Kept free of `getCredentials` so the request is provably credential-less.
 */
async function fetchCatalog(
	this: ILoadOptionsFunctions,
	catalogUrl: string,
): Promise<CatalogRow[]> {
	return (await this.helpers.httpRequest({
		method: 'GET',
		url: catalogUrl,
		json: true,
	})) as CatalogRow[];
}

async function loadModels(
	this: ILoadOptionsFunctions,
	modality: 'image' | 'video',
): Promise<INodePropertyOptions[]> {
	const catalogUrl = await catalogUrlFromCredentials.call(this);
	const rows = await fetchCatalog.call(this, catalogUrl);
	return rows
		.filter((r) => r.modality === modality)
		.map((r) => {
			const unit = r.billing_unit === 'per_second' ? 'sec' : 'image';
			return { name: `${r.model} ($${r.unit_price_usd}/${unit})`, value: r.model };
		})
		.sort((a, b) => a.name.localeCompare(b.name));
}

export const loadOptions = {
	async getImageModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		return loadModels.call(this, 'image');
	},
	async getVideoModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
		return loadModels.call(this, 'video');
	},
};
