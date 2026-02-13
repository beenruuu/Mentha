import { createMenthaClient } from '@mentha/core';
import type { AppType } from 'mentha-api';

import config from './config';

export const client = createMenthaClient<AppType>({
    baseUrl: config.apiBaseUrl,
});
