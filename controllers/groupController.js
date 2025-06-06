const Group = require('../models/Groups');
const User = require('../models/User');
const Schedule = require('../models/Schedule'); // Импортируем модель Schedule
const Homework = require('../models/Homework'); // Импортируем модель Homework

exports.getAllStudents = async (req, res) => {
    try {
        console.log('Получение всех студентов...');
        const students = await User.find({ role: 'student' });
        console.log('Студенты успешно получены:', students);
        res.status(200).json(students);
    } catch (error) {
        console.error('Ошибка при получении студентов:', error);
        res.status(400).json({ message: 'Ошибка при получении студентов', error: error.message });
    }
};


// Создание новой группы
exports.createGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const newGroup = new Group({ name });
        await newGroup.save();
        res.status(201).json(newGroup);
    } catch (error) {
        res.status(400).json({ message: 'Ошибка при создании группы', error: error.message });
    }
};

// Получение всех групп
exports.getAllGroups = async (req, res) => {
    try {
        const groups = await Group.find().populate('students');
        res.status(200).json(groups);
    } catch (error) {
        res.status(400).json({ message: 'Ошибка при получении групп', error: error.message });
    }
};

// Получение студентов группы
exports.getGroupStudents = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id).populate('students');
        if (!group) {
            return res.status(404).json({ message: 'Группа не найдена' });
        }
        res.status(200).json(group.students);
    } catch (error) {
        res.status(400).json({ message: 'Ошибка при получении студентов группы', error: error.message });
    }
};

// Добавление студента в группу
exports.addStudentToGroup = async (req, res) => {
    try {
        const { studentId } = req.body;
        const group = await Group.findById(req.params.id);
        
        if (!group) {
            return res.status(404).json({ message: 'Группа не найдена' });
        }
        
        // Проверяем, что студент уже не в группе
        if (group.students.includes(studentId)) {
            return res.status(400).json({ message: 'Студент уже в группе' });
        }

        // Проверяем, что пользователь существует и является студентом
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(400).json({ message: 'Пользователь не является студентом' });
        }

        group.students.push(studentId);
        await group.save();

        // Возвращаем обновленную группу с заполненными данными студентов
        const updatedGroup = await Group.findById(group._id).populate('students');
        res.status(200).json(updatedGroup);
    } catch (error) {
        res.status(400).json({ message: 'Ошибка при добавлении студента в группу', error: error.message });
    }
};

// Удаление студента из группы
exports.removeStudentFromGroup = async (req, res) => {
    try {
        const { studentId } = req.body;
        const group = await Group.findById(req.params.id);
        
        if (!group) {
            return res.status(404).json({ message: 'Группа не найдена' });
        }
        
        group.students = group.students.filter(id => id.toString() !== studentId);
        await group.save();

        // Возвращаем обновленную группу с заполненными данными студентов
        const updatedGroup = await Group.findById(group._id).populate('students');
        res.status(200).json(updatedGroup);
    } catch (error) {
        res.status(400).json({ message: 'Ошибка при удалении студента из группы', error: error.message });
    }
};

// Обновление группы
exports.updateGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true }
        ).populate('students');
        
        if (!group) {
            return res.status(404).json({ message: 'Группа не найдена' });
        }
        
        res.status(200).json(group);
    } catch (error) {
        res.status(400).json({ message: 'Ошибка при обновлении группы', error: error.message });
    }
};

// Удаление группы
exports.deleteGroup = async (req, res) => {
    try {
        const groupId = req.params.id;

        // Удаляем связанные записи из расписания
        await Schedule.deleteMany({ group_id: groupId });

        // Удаляем связанные записи из домашних заданий
        await Homework.deleteMany({ group_id: groupId });

        // Удаляем группу
        const group = await Group.findByIdAndDelete(groupId);

        if (!group) {
            return res.status(404).json({ message: 'Группа не найдена' });
        }

        res.status(200).json({ message: 'Группа и связанные записи успешно удалены' });
    } catch (error) {
        res.status(400).json({ message: 'Ошибка при удалении группы', error: error.message });
    }
};

exports.getGroupsByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const groups = await Group.find({ students: studentId });
        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};