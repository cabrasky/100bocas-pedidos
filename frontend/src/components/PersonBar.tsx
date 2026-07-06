import { Person } from '../types';

interface Props {
  persons: Person[];
  myName: string;
  currentPersonIdx: number;
  onSelectPerson: (idx: number) => void;
  onDeletePerson: (idx: number) => void;
  onAddPerson: () => void;
}

function PersonBar({ persons, myName, currentPersonIdx, onSelectPerson, onDeletePerson, onAddPerson }: Props) {
  return (
    <div className="persons-bar">
      {persons.map((p, i) => {
        const count = Object.values(p.items).reduce((s, o) => s + o.qty, 0);
        const active = i === currentPersonIdx ? 'active' : '';
        const isMe = p.name === myName;
        return (
          <button
            key={p.name}
            className={`person-chip ${active}`}
            onClick={() => onSelectPerson(i)}
          >
            <i className={`fas ${isMe ? 'fa-crown' : 'fa-user'}`}></i>
            {' '}{p.name}{isMe ? <span style={{fontSize: 9, opacity: 0.6}}> (tú)</span> : ''}
            <span className="p-count">{count}</span>
            {!isMe && (
              <span
                className="p-del"
                onClick={(e) => { e.stopPropagation(); onDeletePerson(i); }}
                title="Eliminar"
              ></span>
            )}
          </button>
        );
      })}
      <button className="add-person-btn" onClick={onAddPerson}>
        <i className="fas fa-plus"></i> Añadir persona
      </button>
    </div>
  );
}

export default PersonBar;
