export interface NavItem {
    label: string;
    href: string;
}

export interface Service {
    id: string;
    title: string;
    description: string;
    metric: string;
}

export interface ClientLogo {
    name: string;
    url: string;
}

export enum Theme {
    LIGHT = 'light',
    DARK = 'dark',
}
