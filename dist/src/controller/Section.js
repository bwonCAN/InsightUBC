"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section = void 0;
class Section {
    ID;
    Course;
    Title;
    Professor;
    Subject;
    Year;
    Avg;
    Pass;
    Fail;
    Audit;
    constructor(id, course, title, professor, subject, year, avg, pass, fail, audit) {
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
exports.Section = Section;
//# sourceMappingURL=Section.js.map