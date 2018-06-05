import models from 'database';
import * as crypto from 'crypto';
import * as Sequelize from 'sequelize';

const {
	PASSWORD_SALT: secret_key
} = process.env;

interface IUser {
	email?: string;
	password?: string;
	display_name?: string;
	userProfileId?: string;
}

interface IUserMethod {
	hash(password: string): string;
	register({ email, password, userProfileId }: IUser): void;
	checkEmail(username: string): boolean;
}

export default class UserMethods implements IUserMethod {
	User = models.User;

	hash(password: string): string {
		console.log(password);
		return crypto.createHmac('sha512', secret_key!).update(password).digest('hex');
	}

	async register({ email, password, userProfileId }: IUser): Promise<any>{
		const { User, hash } = this;
		return User.build({
			fk_userProfile_id: userProfileId,
			email,
			password: hash(password)
		}).save().then(data => {
			const UserId = data.id;
			return User.findOne({ 
				where: {
					id: UserId
				},
				include: { model: models.UserProfile } as any
			}).then(result => result);
		});
	}

	findByEmail(email: string): Sequelize.QueryOptions {
		const { User } = this;
		return User.findOne({ where: { email } });
	}

	async findById(userId: string): Promise<any> {
		const { User } = this;
		return User.findOne({
			where: {
				id: userId
			},
			include: { model: models.UserProfile } as any
		}).then(data => data);
	}

	checkEmail(email: string): boolean {
		const { User } = this;
		const exists = User.findOne({ where: { email } });
		return exists !== null;
	}

	validatePassword(password: string): boolean {
		const { hash } = this;
		const hashed = hash(password);
		return password === hashed;
	}
}