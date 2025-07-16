export class Section {
	public ID: string;
	public Course: string;
	public Title: string;
	public Professor: string;
	public Subject: string;
	public Year: number;
	public Avg: number;
	public Pass: number;
	public Fail: number;
	public Audit: number;

	constructor(
		id: string,
		course: string,
		title: string,
		professor: string,
		subject: string,
		year: number,
		avg: number,
		pass: number,
		fail: number,
		audit: number
	) {
		this.ID = id;
		this.Course = course;
		this.Title = title;
		this.Professor = professor;
		this.Subject = subject;
		this.Year = year;
		this.Avg = avg;
		this.Pass = pass;
		this.Fail = fail;
		this.Audit = audit;
	}
}
