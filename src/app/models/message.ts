export class Messsge {
    id: string;
    email: string;
    name: string;
    photoURL: string;
    emailVerified: boolean;
    description?: string;
    lastUpdated: number;
    doc?: any;

    constructor(
        id,
        email,
        name,
        emailVerified,
        description = "",
        photoURL = "",
        doc = ""
    ) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.emailVerified = emailVerified;
        this.description = description;
        this.photoURL = photoURL;
        this.doc = doc;
        this.lastUpdated = new Date().getTime();
    }
}

